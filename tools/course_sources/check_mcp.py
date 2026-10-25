"""Local protocol smoke test. Reports counts only, never private source text."""
import asyncio,json,sys
from pathlib import Path
from mcp import ClientSession,StdioServerParameters
from mcp.client.stdio import stdio_client

async def main():
    server=Path(__file__).with_name('mcp_server.py')
    async with stdio_client(StdioServerParameters(command=sys.executable,args=[str(server)])) as (read,write):
        async with ClientSession(read,write) as session:
            initialized=await session.initialize();listed=await session.list_tools()
            names=[t.name for t in listed.tools]
            assert set(names)=={'source_catalog','search_coursework','read_source_chunk'}
            catalog=await session.call_tool('source_catalog',{'limit':3})
            hits=await session.call_tool('search_coursework',{'query':'database','limit':2})
            bad=await session.call_tool('read_source_chunk',{'chunk_id':'../../private.txt'})
            assert not catalog.isError and not hits.isError and bad.isError
            print(json.dumps({'protocolInitialized':True,'tools':names,'catalogCallPassed':True,'searchCallPassed':True,'pathInputRejected':True,'transport':'local-stdio','appConfigured':False,'privateExcerptsPrinted':False}))

if __name__=='__main__':asyncio.run(asyncio.wait_for(main(),timeout=45))
